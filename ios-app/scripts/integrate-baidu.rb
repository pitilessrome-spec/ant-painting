# Attach CocoaPods configuration without discarding Capacitor's existing xcconfig.
require 'xcodeproj'
require 'pathname'
root=File.expand_path('../ios/App', __dir__)
project=Xcodeproj::Project.open(File.join(root,'App.xcodeproj'))
target=project.targets.find{|t|t.name=='App'} or abort 'App target missing'
target.build_configurations.each do |c|
  pod=File.join(root,'Pods','Target Support Files','Pods-App',"Pods-App.#{c.name.downcase}.xcconfig")
  abort "Missing #{pod}" unless File.file?(pod)
  base=c.base_configuration_reference
  original=base && base.real_path.to_s
  if original && File.file?(original) && File.expand_path(original)!=File.expand_path(pod)
    rel=Pathname.new(pod).relative_path_from(Pathname.new(File.dirname(original))).to_s
    line="#include \"#{rel}\""
    old=File.read(original)
    File.write(original,old.rstrip+"\n"+line+"\n") unless old.include?(line)
  elsif !original || !File.file?(original)
    c.base_configuration_reference=project.main_group.new_file(Pathname.new(pod).relative_path_from(Pathname.new(root)).to_s)
  end
  %w[PODS_ROOT PODS_PODFILE_DIR_PATH].each{|key|c.build_settings.delete(key)}
  %w[FRAMEWORK_SEARCH_PATHS HEADER_SEARCH_PATHS LIBRARY_SEARCH_PATHS OTHER_LDFLAGS].each do |key|
    v=c.build_settings[key];next if v.nil?
    v=v.is_a?(Array) ? v : [v]
    c.build_settings[key]=(['$(inherited)']+v).uniq
  end
end
project.save
puts 'Integrated CocoaPods xcconfig with existing Capacitor base settings.'
